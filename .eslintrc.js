module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "globals": {
        "filterView": false,
        "filterModel": false,
        "DBHelper": false,
        "controller": false,
        "detailsController": false,
        "mainController": false,
        "breadcrumbView": false,
        "mapModel": false,
        "L": false,
        "restaurantModel": false,
        "restaurantView": false,
        "restaurantsModel": false,
        "restaurantsView": false,

    }
};