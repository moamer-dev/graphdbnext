import { XMLToGraphConverter } from '../lib/xmlConverter/converter';
import * as fs from 'fs';
import * as path from 'path';

const xmlPath = path.join(__dirname, '../../example/KTU_1.14_full.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

const converter = new XMLToGraphConverter(xmlContent);
// @ts-ignore
const elements = converter.allElements as any[];
const target = elements.find((el) => converter['getAttrib'](el).id === 'zrq_s4x_nyb');
if (target) {
  console.log('Tag:', converter['getTag'](target));
  console.log('Text:', JSON.stringify(target.text));
  console.log('Children count:', target.children.length);
  target.children.forEach((child, idx) => {
    console.log(` Child ${idx} tag:`, converter['getTag'](child));
    console.log(`  text:`, JSON.stringify(child.text));
    console.log(`  tail:`, JSON.stringify(child.tail));
  });
} else {
  console.log('Target not found');
}
