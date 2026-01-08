import fs from 'fs';
import path from 'path';
import { SchemaLoaderService } from '../lib/services/SchemaLoaderService';
import { SchemaValidatorService } from '../lib/services/SchemaValidatorService';

async function validate() {
  try {
    // Load schema
    const loader = new SchemaLoaderService(process.cwd());
    const schema = await loader.loadFromJSON();
    
    // Load graph
    const graphPath = path.join(__dirname, '..', 'output', 'KTU_1.14_full.json');
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    
    console.log(`Loaded graph with ${graph.length} elements`);
    
    // Validate
    const validator = new SchemaValidatorService(schema);
    const result = validator.validate(graph);
    
    console.log('\n=== Validation Result ===');
    console.log('Valid:', result.valid);
    console.log('Total Errors:', result.errors.length);
    console.log('Total Warnings:', result.warnings.length);
    console.log('\nStats:', JSON.stringify(result.stats, null, 2));
    
    // Group errors by type
    const errorTypes: Record<string, number> = {};
    result.errors.forEach(err => {
      errorTypes[err.errorType] = (errorTypes[err.errorType] || 0) + 1;
    });
    console.log('\n=== Error Types ===');
    Object.entries(errorTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Show first 30 errors with details
    console.log('\n=== First 30 Errors ===');
    result.errors.slice(0, 30).forEach((err, i) => {
      console.log(`${i+1}. [${err.errorType}] ${err.message}`);
      if (err.details) {
        console.log(`   Details: ${JSON.stringify(err.details)}`);
      }
    });
    
    // Sample errors by type
    console.log('\n=== Sample Errors by Type ===');
    for (const [errorType, count] of Object.entries(errorTypes)) {
      const sample = result.errors.find(e => e.errorType === errorType);
      if (sample) {
        console.log(`\n${errorType} (${count} total):`);
        console.log(`  Example: ${sample.message}`);
        if (sample.details) {
          console.log(`  Details: ${JSON.stringify(sample.details)}`);
        }
      }
    }
    
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

validate();

