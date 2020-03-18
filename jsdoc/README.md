Built in support in VSCode

> jsdoc path/to/my/file.js
> jsdoc -r .


> jsdoc -c /path/to/conf.json
{
    "source": {
        "includePattern": ".+\\.js(doc|x)?$",   // Only process file ending in .js, .jsdoc or .jsx
        "include": ["."],                       // Check all folders.
        "exclude": ["node_modules"]             // Be gone, node_modules.
    },
    "recurseDepth": 10,                         // Only go 10 levels deep.
    "opts": {
        "destination": "./docs/",               // Where I want my docs to be generated.
        "recurse": true                         // Same as using -r or --recurse
    }
}

If you add this in your project package.json
"scripts": {
    "generate-docs": "jsdoc -c /path/to/my/conf.js"
}
you can run this:
> npm run generate-docs


Generalmente i dati da inserire prima di una funzione sono questi:
/**
 * Retrieves a user by email.
 * @async
 * @method
 * @param {String} email - User email
 * @returns {User} User object
 * @throws {NotFoundError} When the user is not found.
 */