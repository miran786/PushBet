module.exports = (req, res, next) => {
    console.log(`[SERVER LOG] ${req.method} ${req.url}`);
    next();
};
