const Sites = Object.freeze({
  wikipedia: {
    name: "Wikipedia",
    link: "wikipedia.org/wiki/",
    icon: "wikipedia.ico",
    href: "https://en.wikipedia.org/",
  },
  stackexchange: {
    name: "Stack Exchange sites",
    link: /((((stackexchange)|(stackoverflow)|(serverfault)|(superuser)|(askubuntu)|(stackapps))\.com)|(mathoverflow\.net))\/((questions)|q)\//,
    title: "Includes Stack Overflow, Super User and many others",
    icon: "stackexchange.ico",
    href: "https://stackexchange.com/sites",
  },
  w3schools: {
    name: "W3Schools",
    link: "https://www.w3schools.com/",
    icon: "w3schools.ico",
    href: "https://www.w3schools.com/",
  },
  mdn: {
    name: "MDN Web Docs",
    link: "https://developer.mozilla.org/",
    icon: "mdn.png",
    href: "https://developer.mozilla.org/",
  },
  genius: {
    name: "Genius",
    link: /https:\/\/genius\.com\/[^\/]*$/,
    icon: "genius.png",
    href: "https://genius.com/",
  },
  unity: {
    name: "Unity Answers",
    link: /https:\/\/answers\.unity\.com\/((questions)|q)\//,
    icon: "unity.ico",
    href: "https://answers.unity.com/",
  },
  mathworks: {
    name: "MATLAB Answers",
    link: "https://www.mathworks.com/matlabcentral/answers/",
    icon: "mathworks.ico",
    href: "https://www.mathworks.com/matlabcentral/answers/",
  },
});