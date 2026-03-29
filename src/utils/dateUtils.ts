import dayjs from 'dayjs';

export function getFinancialYearBounds(dateInput?: Date | string | number | dayjs.Dayjs | null) {
    const d = dateInput ? dayjs(dateInput) : dayjs();
    const year = d.year();
    const month = d.month(); // 0-based. 0 = Jan, 3 = April

    // In India, Financial Year runs April 1st to March 31st
    // If month is April or later, start year is current year.
    // If month is Jan, Feb, Mar, start year is last year.
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;

    const startDate = dayjs(new Date(startYear, 3, 1)); // April 1st
    const endDate = dayjs(new Date(endYear, 2, 31)); // March 31st

    return {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        label: `FY ${startYear}-${endYear}`,
        description: `April 1, ${startYear} — March 31, ${endYear}`
    };
}

export function generateFinancialYearOptions() {
    const today = dayjs();
    const currentFY = getFinancialYearBounds(today);
    
    // Calculate Next FY start date
    const nextFYStart = dayjs(currentFY.endDate).add(1, 'day');
    const nextFY = getFinancialYearBounds(nextFYStart);

    return [currentFY, nextFY];
}
