export function buildPaginatedResponse({ 
    data, 
    message = "Success", 
    pagination = {}, 
    dataKey = "data" // default key name
}) {
    const {
        page,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage,
        nextPageUrl,
        prevPageUrl
    } = pagination;

    return {
        success: true,
        message,
        [dataKey]: data, // 💥 dynamic key here
        totalPages,
        totalItems,
        currentPage: page,
        hasNextPage,
        hasPrevPage,
        nextPageUrl,
        prevPageUrl
    };
}
