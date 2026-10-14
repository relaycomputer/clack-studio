package queue

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"time"
)

var (
	ErrQueueFull = errors.New("compiler queue is full, please retry shortly")
	ErrTimeout   = errors.New("compilation timed out in queue")
)

// Job represents a single unit of compilation work.
type Job struct {
	ID        int64
	Type      string      // "compile", "assemble", "decompile"
	Payload   interface{} // Input parameters
	Result    interface{}
	Err       error
	Done      chan struct{}
	EnqueuedAt time.Time
	StartedAt  time.Time
	FinishedAt time.Time
}

// Stats provides live queue telemetry.
type Stats struct {
	ActiveWorkers    int32   `json:"activeWorkers"`
	MaxWorkers       int     `json:"maxWorkers"`
	QueueLength      int     `json:"queueLength"`
	MaxQueueLength   int     `json:"maxQueueLength"`
	TotalProcessed   int64   `json:"totalProcessed"`
	TotalErrors      int64   `json:"totalErrors"`
	AvgWaitTimeMs    float64 `json:"avgWaitTimeMs"`
	AvgProcessTimeMs float64 `json:"avgProcessTimeMs"`
}

// CompilerQueue coordinates requests across a fixed pool of workers.
type CompilerQueue struct {
	maxWorkers int
	bufferSize int
	jobChan    chan *Job
	workerFunc func(ctx context.Context, job *Job)

	activeWorkers  atomic.Int32
	totalProcessed atomic.Int64
	totalErrors    atomic.Int64
	jobCounter     atomic.Int64

	mu             sync.RWMutex
	totalWaitMs    float64
	totalProcMs    float64
	sampleCount    int64

	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewCompilerQueue creates and starts the queue worker pool.
func NewCompilerQueue(workers int, bufferSize int, workerFunc func(ctx context.Context, job *Job)) *CompilerQueue {
	if workers <= 0 {
		workers = 2
	}
	if bufferSize <= 0 {
		bufferSize = 50
	}

	ctx, cancel := context.WithCancel(context.Background())
	q := &CompilerQueue{
		maxWorkers: workers,
		bufferSize: bufferSize,
		jobChan:    make(chan *Job, bufferSize),
		workerFunc: workerFunc,
		ctx:        ctx,
		cancel:     cancel,
	}

	for i := 0; i < workers; i++ {
		q.wg.Add(1)
		go q.workerLoop()
	}

	return q
}

func (q *CompilerQueue) workerLoop() {
	defer q.wg.Done()
	for {
		select {
		case <-q.ctx.Done():
			return
		case job, ok := <-q.jobChan:
			if !ok {
				return
			}
			q.activeWorkers.Add(1)
			job.StartedAt = time.Now()

			waitMs := float64(job.StartedAt.Sub(job.EnqueuedAt).Milliseconds())

			// Execute job with workerFunc
			q.workerFunc(q.ctx, job)

			job.FinishedAt = time.Now()
			procMs := float64(job.FinishedAt.Sub(job.StartedAt).Milliseconds())

			q.mu.Lock()
			q.sampleCount++
			q.totalWaitMs += waitMs
			q.totalProcMs += procMs
			q.mu.Unlock()

			if job.Err != nil {
				q.totalErrors.Add(1)
			}
			q.totalProcessed.Add(1)
			q.activeWorkers.Add(-1)

			close(job.Done)
		}
	}
}

// Submit enqueues a job and blocks until completion, timeout, or context cancellation.
func (q *CompilerQueue) Submit(ctx context.Context, jobType string, payload interface{}, timeout time.Duration) (*Job, error) {
	job := &Job{
		ID:         q.jobCounter.Add(1),
		Type:       jobType,
		Payload:    payload,
		Done:       make(chan struct{}),
		EnqueuedAt: time.Now(),
	}

	// Try non-blocking push or check buffer full
	select {
	case q.jobChan <- job:
	default:
		return nil, ErrQueueFull
	}

	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	timer := time.NewTimer(timeout)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-timer.C:
		return nil, ErrTimeout
	case <-job.Done:
		return job, job.Err
	}
}

// GetStats returns the queue metrics.
func (q *CompilerQueue) GetStats() Stats {
	q.mu.RLock()
	defer q.mu.RUnlock()

	avgWait := 0.0
	avgProc := 0.0
	if q.sampleCount > 0 {
		avgWait = q.totalWaitMs / float64(q.sampleCount)
		avgProc = q.totalProcMs / float64(q.sampleCount)
	}

	return Stats{
		ActiveWorkers:    q.activeWorkers.Load(),
		MaxWorkers:       q.maxWorkers,
		QueueLength:      len(q.jobChan),
		MaxQueueLength:   q.bufferSize,
		TotalProcessed:   q.totalProcessed.Load(),
		TotalErrors:      q.totalErrors.Load(),
		AvgWaitTimeMs:    avgWait,
		AvgProcessTimeMs: avgProc,
	}
}

// Close shuts down the worker pool.
func (q *CompilerQueue) Close() {
	q.cancel()
	close(q.jobChan)
	q.wg.Wait()
}
