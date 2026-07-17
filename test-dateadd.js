const validRows = [
  { "Order Date": "2024-01-01T00:00:00Z" },
  { "Order Date": "2024-01-15T00:00:00Z" }
];
const dateCol = "Order Date";
const offset = -1;
const interval = "YEAR";

// Collect exact distinct dates
const exactDates = new Set();
validRows.forEach(r => {
    const d = new Date(r[dateCol]);
    d.setHours(0,0,0,0);
    exactDates.add(d.getTime());
});

// Shift them
const shiftedDates = new Set();
exactDates.forEach(time => {
    const d = new Date(time);
    if (interval === 'DAY') d.setDate(d.getDate() + offset);
    else if (interval === 'MONTH') d.setMonth(d.getMonth() + offset);
    else if (interval === 'QUARTER') d.setMonth(d.getMonth() + offset * 3);
    else if (interval === 'YEAR') d.setFullYear(d.getFullYear() + offset);
    shiftedDates.add(d.getTime());
});

console.log(shiftedDates);
