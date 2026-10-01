import sys

with open("src/pages/Contract.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_str = '{/* NOVO: CONTROLES DE MATERIAL E DIREÇÃO */}'
if start_str not in content:
    start_str = '{/* NOVO: CONTROLES DE MATERIAL E DIRE'
    
idx_start = content.find(start_str)

idx_end = content.find('                    {/* Itens Opcionais / Extras */}', idx_start)

if idx_start != -1 and idx_end != -1:
    before = content[:idx_start]
    middle = content[idx_start:idx_end]
    after = content[idx_end:]
    
    new_middle = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n<>\n" + middle + "\n</>\n)}\n                    "
    
    content = before + new_middle + after

start_str2 = '<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 mt-4">'
title2 = 'Ficha de Produ'

idx_start2 = content.find(start_str2)
if idx_start2 != -1 and title2 in content[idx_start2:idx_start2+300]:
    idx_end2 = content.find('<div className="flex flex-col gap-4 mt-2">', idx_start2)
    
    if idx_end2 != -1:
        before = content[:idx_start2]
        middle = content[idx_start2:idx_end2]
        after = content[idx_end2:]
        
        new_middle = "{originalInputData?.quoteType !== 'landing' && originalInputData?.quoteType !== 'guardrail' && (\n" + middle + "\n)}\n                        "
        
        content = before + new_middle + after

with open("src/pages/Contract.tsx", "w", encoding="utf-8") as f:
    f.write(content)
