const fs = require('fs');
let c = fs.readFileSync('src/components/CalculatorForm.tsx', 'utf8');

c = c.replace(
  /const handleAddItem = \(\) => \{\s*if \(newItemName && newItemPrice\) \{\s*setOptionalItems\(\[\.\.\.optionalItems, \{ id: Date\.now\(\)\.toString\(\), name: newItemName, price: parseFloat\(newItemPrice\) \|\| 0 \}\]\);\s*setNewItemName\(''\);\s*setNewItemPrice\(''\);\s*\}\s*\};/g,
  `const handleAddItem = () => {
    if (newItemName && newItemPrice) {
      const newItems = [...optionalItems, { id: Date.now().toString(), name: newItemName, price: parseFloat(newItemPrice) || 0 }];
      setOptionalItems(newItems);
      setNewItemName('');
      setNewItemPrice('');
      setTimeout(() => {
          const fd = getFormData();
          if (fd) { fd.optionalItems = newItems; onCalculate(fd); }
      }, 0);
    }
  };`
);

c = c.replace(
  /const handleRemoveItem = \(id: string\) => \{\s*setOptionalItems\(optionalItems\.filter\(item => item\.id !== id\)\);\s*\};/g,
  `const handleRemoveItem = (id: string) => {
    const newItems = optionalItems.filter(item => item.id !== id);
    setOptionalItems(newItems);
    setTimeout(() => {
        const fd = getFormData();
        if (fd) { fd.optionalItems = newItems; onCalculate(fd); }
    }, 0);
  };`
);

fs.writeFileSync('src/components/CalculatorForm.tsx', c);
