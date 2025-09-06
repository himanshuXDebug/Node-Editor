export default class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.queue = [];
    this.activeCount = 0;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      if (this.queue.length > 0) {
        this.queue.forEach(item => item.reject(new Error('Request cancelled')));
        this.queue = [];
      }
      
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  next() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { task, resolve, reject } = this.queue.shift();
    this.activeCount++;

    Promise.resolve(task())
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.activeCount--;
        this.next();
      });
  }

  clear() {
    this.queue.forEach(item => item.reject(new Error('Queue cleared')));
    this.queue = [];
  }
}
