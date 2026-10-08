const fs = require('fs');
let c = fs.readFileSync('src/pages/Contract.tsx', 'utf8');

c = c.replace(
    "const [hasWheels, setHasWheels] = useState<boolean>(false);",
    "const [hasWheels, setHasWheels] = useState<boolean>(false);\n    const [hasStairSideBar, setHasStairSideBar] = useState<boolean>(false);\n    const [stairSideBarPrice, setStairSideBarPrice] = useState('0');"
);

fs.writeFileSync('src/pages/Contract.tsx', c);
console.log("Added state");
