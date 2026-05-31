import * as fs from 'fs';
import * as path from 'path';
import { ProvenanceRecord } from './types';

class ProvenanceStore {
  private byFunction = new Map<string, ProvenanceRecord>(); // key: functionName.lower
  private byFile = new Map<string, ProvenanceRecord[]>();   // key: filePath (file + function records)
  private _all: ProvenanceRecord[] = [];
  private loaded = false;

  private load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const seedPath = path.join(__dirname, '..', 'seed', 'demo.json');
      const records: ProvenanceRecord[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      for (const r of records) {
        this._all.push(r);
        const t = r.target;
        if (t.kind === 'function') {
          this.byFunction.set(t.functionName.toLowerCase(), r);
          const bucket = this.byFile.get(t.filePath) ?? [];
          bucket.push(r);
          this.byFile.set(t.filePath, bucket);
        } else if (t.kind === 'file') {
          const bucket = this.byFile.get(t.filePath) ?? [];
          bucket.push(r);
          this.byFile.set(t.filePath, bucket);
        } else if (t.kind === 'files') {
          for (const fp of t.filePaths) {
            const bucket = this.byFile.get(fp) ?? [];
            bucket.push(r);
            this.byFile.set(fp, bucket);
          }
        }
      }
    } catch (e) {
      console.error('PyLens: failed to load seed data', e);
    }
  }

  /** Look up a specific tracked function by name. */
  getByFunction(functionName: string): ProvenanceRecord | null {
    this.load();
    return this.byFunction.get(functionName.toLowerCase()) ?? null;
  }

  /** All records that touch a given file path (any kind). */
  getByFile(filePath: string): ProvenanceRecord[] {
    this.load();
    // Try exact match first, then basename match for demo convenience
    return this.byFile.get(filePath)
      ?? this.byFile.get(path.basename(filePath))
      ?? [];
  }

  getAllRecords(): ProvenanceRecord[] {
    this.load();
    return this._all;
  }
}

export const store = new ProvenanceStore();
