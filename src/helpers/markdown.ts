export const markdownToHtml = (markdown: string) => {
  // headers
  let html = markdown
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>");

  // **bold**
  html = html
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // unordered lists (* or - → <ul><li>...</li></ul>)
  html = html.replace(/^[\*\-] (.*$)/gm, "<li o>$1</li>");
  html = html.replace(/(<li o>.*?<\/li>\n+)+/g, (match) => `<ul>${match}</ul>`);

  // ordered lists (1. → <ol><li>...</li></ol>)
  html = html.replace(/^\d+\. (.*$)/gm, "<li uno>$1</li>");
  html = html.replace(
    /(<li uno>.*?<\/li>\n+)+/g,
    (match) => `<ol>${match}</ol>`
  );

  // italics (*xxx* or _xxx_ → <em>xxx</em>)
  html = html
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");

  // blockquotes (> quote → <blockquote>quote</blockquote>)
  html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

  // hr (--- → <hr>)
  html = html.replace(/^---$/gm, "<hr/>");

  // newline
  html = html.replace(/\n\n+/g, "<br/>");

  /*
  // Paragraphs (split by double newline)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`.replace(/<p><\/p>/g, '');
    
  // Links ([text](url) → <a href="url">text</a>)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images (![alt](src) → <img src="src" alt="alt">)
  html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Code Blocks (```code``` → <pre><code>code</code></pre>)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
             .replace(/`([^`]+)`/g, '<code>$1</code>');
*/
  return html;
};
