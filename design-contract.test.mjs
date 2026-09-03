import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./App.js', import.meta.url), 'utf8');

assert.match(source, /bgDark:\s*isDark\s*\?\s*'#10241e'\s*:\s*'#f7f4ec'/i, 'tema sıcak kırık beyaz ve koyu yeşil zemini kullanmalı');
assert.match(source, /primary:\s*isDark\s*\?\s*'#8fc3aa'\s*:\s*'#235b43'/i, 'tema kurumsal yeşil vurgu rengini kullanmalı');
assert.match(source, /fonts\.googleapis\.com[^']*Manrope/, 'arayüz başlık yazı tipi yüklenmeli');
assert.match(source, /fonts\.googleapis\.com[^']*Newsreader/, 'editoryal başlık yazı tipi yüklenmeli');
assert.match(source, /localStorage\.getItem\('demo_theme'\)\s*\|\|\s*'dark'/, 'mevcut varsayılan tema davranışı korunmalı');

const decorativeEmoji = /\p{Extended_Pictographic}/u;
assert.doesNotMatch(source, decorativeEmoji, 'arayüz metinlerinde dekoratif emoji kalmamalı');

console.log('design contract passed');
