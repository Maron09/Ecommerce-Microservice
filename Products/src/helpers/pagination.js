// Description: This module provides a function to handle pagination for API responses.


const paginationResults = (req, totalItems) => {
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${host}/v1/${req.originalUrl.split("?")[0].replace("/api", "")}`;


    let page = Math.max(parseInt(req.query.page) || 1, 1)
    let limit = Math.max(parseInt(req.query.limit) || 5, 1)
    let skip = (page - 1) * limit
    let totalPages = Math.ceil(totalItems / limit)

    const generatePageUrl = (newPage) => {
        const queryParams = new URLSearchParams(req.query)
        queryParams.set("page", newPage)
        return `${baseUrl}?${queryParams.toString()}`
    }

    return {
        totalItems,
        page,
        limit,
        skip,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPageUrl: page < totalPages ? generatePageUrl(page + 1) : null,
        prevPageUrl: page > 1 ? generatePageUrl(page - 1) : null,
    }
}

export default paginationResults