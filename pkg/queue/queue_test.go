package queue

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestCompilerQueue_Sequential(t *testing.T) {
	q := NewCompilerQueue(2, 10, func(ctx context.Context, job *Job) {
		time.Sleep(5 * time.Millisecond)
		job.Result = "ok"
	})
	defer q.Close()

	ctx := context.Background()
	job, err := q.Submit(ctx, "compile", "payload", time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if job.Result != "ok" {
		t.Fatalf("expected 'ok', got %v", job.Result)
	}

	stats := q.GetStats()
	if stats.TotalProcessed != 1 {
		t.Errorf("expected 1 processed, got %d", stats.TotalProcessed)
	}
}

func TestCompilerQueue_Full(t *testing.T) {
	block := make(chan struct{})
	q := NewCompilerQueue(1, 2, func(ctx context.Context, job *Job) {
		<-block
	})
	defer func() {
		close(block)
		q.Close()
	}()

	ctx := context.Background()
	// Fill 1 active worker + 2 buffer slots
	go q.Submit(ctx, "test", 1, time.Second) // worker 1
	time.Sleep(10 * time.Millisecond)
	go q.Submit(ctx, "test", 2, time.Second) // queue slot 1
	go q.Submit(ctx, "test", 3, time.Second) // queue slot 2
	time.Sleep(10 * time.Millisecond)

	// Fourth should fail with ErrQueueFull
	_, err := q.Submit(ctx, "test", 4, time.Second)
	if err != ErrQueueFull {
		t.Fatalf("expected ErrQueueFull, got %v", err)
	}
}

func TestCompilerQueue_Concurrency(t *testing.T) {
	workerCount := 2
	jobCount := 20
	q := NewCompilerQueue(workerCount, 50, func(ctx context.Context, job *Job) {
		time.Sleep(5 * time.Millisecond)
		job.Result = job.Payload.(int) * 2
	})
	defer q.Close()

	var wg sync.WaitGroup
	errCount := 0
	var mu sync.Mutex

	for i := 0; i < jobCount; i++ {
		wg.Add(1)
		go func(val int) {
			defer wg.Done()
			job, err := q.Submit(context.Background(), "test", val, 2*time.Second)
			if err != nil {
				mu.Lock()
				errCount++
				mu.Unlock()
				return
			}
			if job.Result.(int) != val*2 {
				t.Errorf("expected %d, got %v", val*2, job.Result)
			}
		}(i)
	}

	wg.Wait()
	if errCount > 0 {
		t.Fatalf("%d jobs failed", errCount)
	}

	stats := q.GetStats()
	if stats.TotalProcessed != int64(jobCount) {
		t.Errorf("expected %d processed, got %d", jobCount, stats.TotalProcessed)
	}
}
