/**
 * CleanupWorker Queue
 * For adding jobs to be processed by CleanupWorker worker
 * 
 * Supports two modes:
 * 1. Queue Mode (with Redis) - for production with BullMQ
 * 2. Direct Mode (no Redis) - for development or simple deployments
 */

// Check if Redis is configured
const USE_QUEUE = process.env.USE_QUEUE === 'true' && 
                  process.env.REDIS_HOST && 
                  process.env.REDIS_PORT;

let queue: any;

if (USE_QUEUE) {
  try {
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;

    const connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

    queue = new Queue('', {
      connection,
      defaultJobOptions: {
        attempts: ,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs
        },
        timeout: ,
      },
    });

    console.log(`✓ Queue  initialized (Redis mode)`);
  } catch (error) {
    console.warn('⚠️ Redis not available - falling back to direct mode');
  }
}

// Direct execution mode (no Redis)
if (!USE_QUEUE || !queue) {
  console.log(`✓ Queue  in direct mode (no Redis required)`);
  
  // Import the worker's direct executor
  const workerModule = await import('./cleanup-worker.worker.js');
  
  // Mock queue interface that executes jobs directly
  queue = {
    name: '',
    mode: 'direct',
    
    /**
     * Add job - executes immediately in direct mode
     */
    async add(jobName: string, data: any, options?: any): Promise<{ id: string; data: any }> {
      const jobId = `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[Direct] Executing job ${jobId}: ${jobName}`);
      
      try {
        const result = await workerModule.executeDirect(data);
        console.log(`[Direct] Job ${jobId} completed`);
        
        return {
          id: jobId,
          data: result,
        };
      } catch (error) {
        console.error(`[Direct] Job ${jobId} failed:`, error);
        throw error;
      }
    },
    
    /**
     * Get job - not supported in direct mode
     */
    async getJob(jobId: string) {
      console.warn(`[Direct] getJob() not supported in direct mode`);
      return null;
    },
    
    /**
     * Get job counts - mock data in direct mode
     */
    async getWaitingCount() { return 0; },
    async getActiveCount() { return 0; },
    async getCompletedCount() { return 0; },
    async getFailedCount() { return 0; },
    
    /**
     * Close queue
     */
    async close() {
      console.log('[Direct] Queue closed (no-op in direct mode)');
    },
  };
}

// Health check
export async function getQueueHealth() {
  if (queue.mode === 'direct') {
    return {
      queue: '',
      mode: 'direct',
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      message: 'Direct execution mode (no Redis)',
    };
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    queue: '',
    mode: 'redis',
    waiting,
    active,
    completed,
    failed,
  };
}

console.log(`📦 CleanupWorker queue ready (mode: ${queue.mode || 'redis'})`);

export const cleanupWorkerQueue = queue;
