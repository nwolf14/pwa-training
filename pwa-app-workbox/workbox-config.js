// module.exports = {
//   "globDirectory": ".",
//   "globPatterns": [
//     "**/*.{html,js,json,css,png}",
//   ],
//   "swDest": "sw.js",
//   "swSrc": "sw-base.js"
// };

module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "**/*.{html,js,json,css}",
  ],
  "swDest": "sw.js",
  "swSrc": "sw-base.js",
  "globIgnores": [
    "images/icons/*.png",
    "node_modules/**/*.*",
    "contact.html",
    "about.html",
  ]
};