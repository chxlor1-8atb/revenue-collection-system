const fs = require('fs');
const file = 'src/app/dashboard/history/HistoryClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace CSS animation
content = content.replace(
  "animate-in slide-in-from-bottom-4 fade-in duration-500\" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}",
  "animate-in slide-in-from-bottom-6 fade-in duration-700\" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}"
);

// 2. Add limit state
content = content.replace(
  'const limit = 20;',
  'const [limit, setLimit] = useState(10);'
);

// 3. Add limit to dependencies
content = content.replace(
  '}, [page, search, startDate, endDate, status, channel, monthYear]);',
  '}, [page, search, startDate, endDate, status, channel, monthYear, limit]);'
);

// 4. Update TablePagination
content = content.replace(
  `      {!isLoading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={setPage}
        />
      )}`,
  `      {!isLoading && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}`
);

fs.writeFileSync(file, content);
console.log("HistoryClient updated!");
