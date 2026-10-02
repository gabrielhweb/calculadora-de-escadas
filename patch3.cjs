const fs = require('fs');
let c = fs.readFileSync('src/components/StaircaseVisualizer.tsx', 'utf8');

const newLine = "<div className=\"w-full h-full flex flex-col\">" +
                "    {!isGuardrailOnly && (" +
                "        <div className=\"flex-1 relative min-h-[50%]\">" +
                "            {viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />}" +
                "        </div>" +
                "    )}" +
                "    <div className=\"shrink-0\">" +
                "        {renderGuardrailsPreviews()}" +
                "    </div>" +
                "</div>";

c = c.replace(/\{isGuardrailOnly \? null : \(viewMode === 'side' \? <SVGContent \/> : <Interactive3DStair option=\{option\} totalHeight=\{totalHeight\} inputData=\{inputData\} treadMaterial=\{treadMaterial\} \/>\)\}\s*\{renderGuardrailsPreviews\(\)\}/g, newLine);

fs.writeFileSync('src/components/StaircaseVisualizer.tsx', c);
console.log('Fixed flex container layout');
