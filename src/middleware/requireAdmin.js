function requireAdmin(req, res, next) {
    // revisar que efectivamente venga de API Gateway, y después revisar que diga que es admin. la idea es solo creerle
    // si viene de API Gateway para que no se falsee
    const apiGatewayToken = req.headers["x-api-gateway-token"];

    if (apiGatewayToken !== process.env.API_GATEWAY_SECRET) {
        return res.status(403).json({
            error: "Forbidden",
            message: "Direct access not allowed",
        });
    }

    const isAdminRequest = req.headers["x-admin-request"];

    if (isAdminRequest !== "true") {
        return res.status(403).json({
            error: "Forbidden",
            message: "Admin privileges required",
        });
    }

    next();
}

module.exports = { requireAdmin };
