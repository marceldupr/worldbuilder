
/**
 * CleanupWorker Worker
 * 
 * 
 * Supports two modes:
 * 1. Queue Mode (with Redis) - for production with BullMQ
 * 2. Direct Mode (no Redis) - for development or simple deployments
 */

// Check if Redis is available
const USE_QUEUE = process.env.USE_QUEUE === 'true' && 
                  process.env.REDIS_HOST && 
                  process.env.REDIS_PORT;

// Lazy import for optional dependencies
let Worker: any, Job: any, Queue: any, Redis: any;
let connection: any;
let worker: any;

if (USE_QUEUE) {
  try {
    const bullmq = await import('bullmq');
    Worker = bullmq.Worker;
    Job = bullmq.Job;
    Queue = bullmq.Queue;
    
    const ioredis = await import('ioredis');
    Redis = ioredis.default;
    
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });
    
    console.log(`✓ Redis connected - Queue mode enabled for CleanupWorker`);
  } catch (error) {
    console.warn('⚠️ Redis not available - falling back to direct mode');
    USE_QUEUE = false;
  }
}


// Job data interface
export interface CleanupWorkerJobData {
  [key: string]: any;
}

// Job processor
async function processJob(job: Job<CleanupWorkerJobData>): Promise<any> {
  console.log(`Processing job ${job.id} in queue `);
  
  try {
    const { data } = job;
    
    
    await job.updateProgress(100);
    console.log(`Job ${job.id} completed successfully`);
    
    return { success: true };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Execute job directly (without queue)
 * Used when Redis is not available
 */
export async function executeDirect(data: CleanupWorkerJobData): Promise<any> {
  console.log(`[Direct] Executing CleanupWorker job`);
  
  const mockJob = {
    id: `direct-${Date.now()}`,
    data,
    updateProgress: async (progress: number) => {
      console.log(`[Direct] Progress: ${progress}%`);
    },
  };
  
  return await processJob(mockJob as any);
}

// Initialize based on mode
if (USE_QUEUE) {
  // Create BullMQ worker
  worker = new Worker('', processJob, {
    connection,
    concurrency: ,
    limiter: {
      max: ,
      duration: 1000,
    },
  });

  // Event handlers
  worker.on('completed', (job: any) => {
    console.log(`✓ Job ${job.id} completed`);
  });

  worker.on('failed', (job: any, err: Error) => {
    console.error(`✗ Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err: Error) => {
    console.error('Worker error:', err);
  });

  console.log(`🚀 CleanupWorker worker started (queue: , concurrency: )`);
  
  export default worker;
} else {
  // Direct mode - export the executor function
  console.log(`🚀 CleanupWorker worker started (direct mode - no queue)`);
  
  // Export a mock worker interface for compatibility
  export default {
    name: 'CleanupWorker',
    mode: 'direct',
    execute: executeDirect,
  };
}

