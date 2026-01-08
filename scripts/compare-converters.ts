import { XMLConverterService } from '../lib/services/XMLConverterService';
import * as fs from 'fs';
import * as path from 'path';

// Read XML file
const xmlPath = path.join(__dirname, '../../example/KTU_1.14_full.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Convert using TypeScript converter
console.log('Converting XML using TypeScript converter...');
const service = new XMLConverterService();
const graph = service.convertXMLToGraph(xmlContent);

// Save to file
const outputPath = path.join(__dirname, '../../example/graph_typescript.json');
fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));

console.log('\nTypeScript Converter Results:');
console.log('  Total elements:', graph.length);
const nodes = graph.filter(e => e.type === 'node');
const relations = graph.filter(e => e.type === 'relationship');
console.log('  Nodes:', nodes.length);
console.log('  Relationships:', relations.length);

// Count node labels
const nodeLabels: Record<string, number> = {};
for (const node of nodes) {
  for (const label of node.labels || []) {
    nodeLabels[label] = (nodeLabels[label] || 0) + 1;
  }
}
console.log('\n  Top 10 Node Labels:');
const sortedLabels = Object.entries(nodeLabels)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
for (const [label, count] of sortedLabels) {
  console.log(`    ${label}: ${count}`);
}

// Count relationship labels
const relLabels: Record<string, number> = {};
for (const rel of relations) {
  const label = rel.label || 'unknown';
  relLabels[label] = (relLabels[label] || 0) + 1;
}
console.log('\n  Relationship Labels:');
for (const [label, count] of Object.entries(relLabels).sort()) {
  console.log(`    ${label}: ${count}`);
}

console.log(`\nSaved TypeScript output to: ${outputPath}`);

