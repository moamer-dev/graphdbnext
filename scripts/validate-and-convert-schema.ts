/**
 * Script to validate application.md against Schema/ directory
 * and convert it to JSON/JSON-LD format
 * 
 * Run with: npx tsx scripts/validate-and-convert-schema.ts
 */

import fs from 'fs';
import path from 'path';
import { SchemaLoaderService } from '../lib/services/SchemaLoaderService';
import type { Schema, SchemaNode, SchemaRelation } from '../lib/services/SchemaLoaderService';

interface SchemaJSON {
  version: string;
  lastUpdated: string;
  source: string;
  nodes: Record<string, SchemaNode>;
  relations: Record<string, SchemaRelation>;
}

interface SchemaJSONLD {
  '@context': {
    '@vocab': string;
    schema: string;
    rdf: string;
    rdfs: string;
    xsd: string;
  };
  '@graph': unknown[];
}

async function validateAndConvert() {
  const basePath = path.join(__dirname, '..', '..');
  const outputDir = path.join(__dirname, '..', 'public', 'schema');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // The SchemaLoaderService will handle path resolution with fallbacks
  // It tries: graphdbnext/assets/schema, assets/schema, and EUPT-LPG/EUPT Model/Schema
  console.log('Loading schema from application.md...');
  const loader = new SchemaLoaderService(basePath);
  const schema = await loader.load();

  console.log(`\n✓ Loaded ${Object.keys(schema.nodes).length} nodes`);
  console.log(`✓ Loaded ${Object.keys(schema.relations).length} relations`);

  // Optional: Validate against Schema/ directory (informational only)
  console.log('\nValidating against Schema/ directory (informational)...');
  const validationResults = await validateAgainstSchemaDirectory(basePath, schema);
  
  if (validationResults.errors.length > 0) {
    console.log('\n⚠ Schema/ directory contains nodes/relations not in application.md:');
    validationResults.errors.forEach(err => console.log(`  - ${err}`));
    console.log('  (This is expected if application.md is a curated application profile)');
  } else {
    console.log('✓ All nodes/relations in Schema/ directory are present in application.md');
  }

  if (validationResults.warnings.length > 0) {
    console.log('\n⚠ Warnings:');
    validationResults.warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  // Convert to JSON
  const schemaJSON: SchemaJSON = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    source: 'application.md',
    nodes: schema.nodes,
    relations: schema.relations,
  };

  const jsonPath = path.join(outputDir, 'schema.json');
  fs.writeFileSync(jsonPath, JSON.stringify(schemaJSON, null, 2));
  console.log(`\n✓ Saved JSON schema to: ${jsonPath}`);

  // Convert to JSON-LD
  const schemaJSONLD = convertToJSONLD(schema);
  const jsonldPath = path.join(outputDir, 'schema.jsonld');
  fs.writeFileSync(jsonldPath, JSON.stringify(schemaJSONLD, null, 2));
  console.log(`✓ Saved JSON-LD schema to: ${jsonldPath}`);

  // Generate summary
  const summary = {
    nodes: Object.keys(schema.nodes).length,
    relations: Object.keys(schema.relations).length,
    totalProperties: Object.values(schema.nodes).reduce((sum, node) => sum + Object.keys(node.properties).length, 0) +
                     Object.values(schema.relations).reduce((sum, rel) => sum + Object.keys(rel.properties).length, 0),
    validation: {
      passed: validationResults.errors.length === 0,
      errors: validationResults.errors.length,
      warnings: validationResults.warnings.length,
    },
  };

  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✓ Saved summary to: ${summaryPath}`);

  console.log('\n📊 Summary:');
  console.log(`  Nodes: ${summary.nodes}`);
  console.log(`  Relations: ${summary.relations}`);
  console.log(`  Total Properties: ${summary.totalProperties}`);
  console.log(`  Validation: ${summary.validation.passed ? '✓ Passed' : '✗ Failed'} (${summary.validation.errors} errors, ${summary.validation.warnings} warnings)`);
}

async function validateAgainstSchemaDirectory(
  basePath: string,
  schema: Schema
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Try new location first, then fallback to old location
  let nodesPath = path.join(basePath, 'graphdbnext', 'assets', 'schema', 'Nodes');
  let relationsPath = path.join(basePath, 'graphdbnext', 'assets', 'schema', 'Relations');
  
  if (!fs.existsSync(nodesPath)) {
    // Fallback to old location
    nodesPath = path.join(basePath, 'EUPT-LPG', 'EUPT Model', 'Schema', 'Nodes');
    relationsPath = path.join(basePath, 'EUPT-LPG', 'EUPT Model', 'Schema', 'Relations');
  }

  // Check nodes
  if (fs.existsSync(nodesPath)) {
    const nodeFiles = fs.readdirSync(nodesPath)
      .filter(f => f.endsWith('.md') && !f.toLowerCase().startsWith('muster_'));
    
    const nodeNamesFromFiles = nodeFiles.map(f => {
      const content = fs.readFileSync(path.join(nodesPath, f), 'utf-8');
      const titleMatch = content.match(/^# (.+)$/m);
      return titleMatch ? titleMatch[1] : null;
    }).filter(Boolean) as string[];

    const nodeNamesFromSchema = Object.keys(schema.nodes);

    // Check for missing nodes
    for (const nodeName of nodeNamesFromFiles) {
      if (!schema.nodes[nodeName]) {
        errors.push(`Node "${nodeName}" exists in Schema/Nodes/ but not in application.md`);
      }
    }

    // Check for extra nodes
    for (const nodeName of nodeNamesFromSchema) {
      if (!nodeNamesFromFiles.includes(nodeName)) {
        warnings.push(`Node "${nodeName}" in application.md but no corresponding file in Schema/Nodes/`);
      }
    }
  }

  // Check relations
  if (fs.existsSync(relationsPath)) {
    const relationFiles = fs.readdirSync(relationsPath)
      .filter(f => f.endsWith('.md') && !f.toLowerCase().startsWith('muster_'));
    
    const relationNamesFromFiles = relationFiles.map(f => {
      const content = fs.readFileSync(path.join(relationsPath, f), 'utf-8');
      const titleMatch = content.match(/^# (.+)$/m);
      return titleMatch ? titleMatch[1] : null;
    }).filter(Boolean) as string[];

    const relationNamesFromSchema = Object.keys(schema.relations);

    // Check for missing relations
    for (const relationName of relationNamesFromFiles) {
      if (!schema.relations[relationName]) {
        errors.push(`Relation "${relationName}" exists in Schema/Relations/ but not in application.md`);
      }
    }

    // Check for extra relations
    for (const relationName of relationNamesFromSchema) {
      if (!relationNamesFromFiles.includes(relationName)) {
        warnings.push(`Relation "${relationName}" in application.md but no corresponding file in Schema/Relations/`);
      }
    }
  }

  return { errors, warnings };
}

function convertToJSONLD(schema: Schema): SchemaJSONLD {
  const graph: Record<string, unknown>[] = [];

  // Convert nodes to JSON-LD
  for (const [nodeName, node] of Object.entries(schema.nodes)) {
    const nodeLD: Record<string, unknown> = {
      '@id': `schema:${nodeName}`,
      '@type': 'schema:Node',
      'schema:name': nodeName,
      'rdfs:label': nodeName,
    };

    if (node.superclassNames && node.superclassNames.length > 0) {
      nodeLD['rdfs:subClassOf'] = node.superclassNames.map((sc) => `schema:${sc}`);
    }

    if (Object.keys(node.properties).length > 0) {
      nodeLD['schema:properties'] = Object.entries(node.properties).map(([propName, prop]) => ({
        '@id': `schema:${nodeName}/${propName}`,
        'schema:name': propName,
        'schema:datatype': prop.datatype || 'xsd:string',
        'schema:required': prop.required,
        'schema:allowedValues': prop.values,
      }));
    }

    if (node.relationsOut && Object.keys(node.relationsOut).length > 0) {
      nodeLD['schema:relationsOut'] = Object.entries(node.relationsOut).map(([relName, targets]) => ({
        'schema:relation': `schema:${relName}`,
        'schema:targets': (targets as string[]).map((t) => `schema:${t}`),
      }));
    }

    if (node.relationsIn && Object.keys(node.relationsIn).length > 0) {
      nodeLD['schema:relationsIn'] = Object.entries(node.relationsIn).map(([relName, sources]) => ({
        'schema:relation': `schema:${relName}`,
        'schema:sources': (sources as string[]).map((s) => `schema:${s}`),
      }));
    }

    graph.push(nodeLD);
  }

  // Convert relations to JSON-LD
  for (const [relationName, relation] of Object.entries(schema.relations)) {
    const relationLD: Record<string, unknown> = {
      '@id': `schema:${relationName}`,
      '@type': 'schema:Relation',
      'schema:name': relationName,
      'rdfs:label': relationName,
    };

    if (Object.keys(relation.properties).length > 0) {
      relationLD['schema:properties'] = Object.entries(relation.properties).map(([propName, prop]) => ({
        '@id': `schema:${relationName}/${propName}`,
        'schema:name': propName,
        'schema:datatype': prop.datatype || 'xsd:string',
        'schema:required': prop.required,
      }));
    }

    if (Object.keys(relation.domains).length > 0) {
      relationLD['schema:domains'] = Object.entries(relation.domains).map(([source, targets]) => ({
        'schema:source': `schema:${source}`,
        'schema:targets': (targets as string[]).map((t) => `schema:${t}`),
      }));
    }

    graph.push(relationLD);
  }

  return {
    '@context': {
      '@vocab': 'https://eupt.example.org/schema/',
      schema: 'https://eupt.example.org/schema/',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
    '@graph': graph,
  };
}

// Run if called directly
if (require.main === module) {
  validateAndConvert().catch(console.error);
}

export { validateAndConvert, convertToJSONLD };

