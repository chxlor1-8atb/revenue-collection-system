const fs = require('fs');

const file = 'src/app/dashboard/houses/HousesClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add CustomSelect import
if (!content.includes('import CustomSelect')) {
  content = content.replace(
    'import SearchAutocomplete from "@/components/SearchAutocomplete";',
    'import SearchAutocomplete from "@/components/SearchAutocomplete";\nimport CustomSelect from "@/components/CustomSelect";'
  );
}

// 2. Add initialZone to Props
if (!content.includes('initialZone?: string')) {
  content = content.replace(
    'initialSearch = "",',
    'initialSearch = "",\n  initialZone = "",'
  );
  content = content.replace(
    'initialSearch?: string;',
    'initialSearch?: string;\n  initialZone?: string;'
  );
}

// 3. Add state for zone
if (!content.includes('selectedZone')) {
  content = content.replace(
    'const [searchQuery, setSearchQuery] = useState(initialSearch);',
    'const [searchQuery, setSearchQuery] = useState(initialSearch);\n  const [selectedZone, setSelectedZone] = useState(initialZone);'
  );
}

// 4. Update url params function
if (!content.includes('newZone: string')) {
  content = content.replace(
    'const updateUrlParams = (page: number, q: string, sortKey: string, sortDir: string, newLimit: number) => {',
    'const updateUrlParams = (page: number, q: string, sortKey: string, sortDir: string, newLimit: number, newZone: string) => {'
  );
  content = content.replace(
    "if (newLimit !== 10) params.set('limit', newLimit.toString());\n      else params.delete('limit');",
    "if (newLimit !== 10) params.set('limit', newLimit.toString());\n      else params.delete('limit');\n\n      if (newZone) params.set('zone', newZone);\n      else params.delete('zone');"
  );
}

// 5. Update calls to updateUrlParams
content = content.replace(
  'updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit);',
  'updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "");'
);
content = content.replace(
  'updateUrlParams(currentPage, searchQuery, key, newDir, limit);',
  'updateUrlParams(currentPage, searchQuery, key, newDir, limit, selectedZone || "");'
);
content = content.replace(
  'updateUrlParams(newPage, searchQuery, sortConfig.key, sortConfig.dir, limit);',
  'updateUrlParams(newPage, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "");'
);
content = content.replace(
  'updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, newLimit);',
  'updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, newLimit, selectedZone || "");'
);

// 6. Add effect for selectedZone change
if (!content.includes('Zone Filter Effect')) {
  content = content.replace(
    '// Debounced Search',
    `// Zone Filter Effect
  useEffect(() => {
    if (selectedZone !== initialZone) {
      startTransition(() => {
        updateUrlParams(1, searchQuery, sortConfig.key, sortConfig.dir, limit, selectedZone || "");
      });
    }
  }, [selectedZone]);

  // Debounced Search`
  );
}

// 7. Add CustomSelect UI next to SearchAutocomplete
if (!content.includes('placeholder="ทุกชุมชน"')) {
  const searchUI = `<div className="relative w-full sm:w-80 z-20">
              <SearchAutocomplete 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="ค้นหาบ้านหรือชื่อเจ้าของ..."
                className="w-full sm:w-80 focus:w-full sm:focus:w-80 !bg-slate-50 border-transparent focus:border-[#5B58F2] focus:ring-2 focus:ring-[#5B58F2]/20 shadow-none text-sm rounded-xl"
              />
            </div>`;

  const newUI = `${searchUI}
            <div className="w-full sm:w-48 z-10">
              <CustomSelect
                value={selectedZone || ""}
                onChange={setSelectedZone}
                placeholder="ทุกชุมชน"
                options={[
                  { value: "", label: "ทุกชุมชน" },
                  ...["หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"].map(z => ({ value: z, label: z }))
                ]}
              />
            </div>`;

  content = content.replace(searchUI, newUI);
}

fs.writeFileSync(file, content);
console.log("HousesClient.tsx updated successfully!");
