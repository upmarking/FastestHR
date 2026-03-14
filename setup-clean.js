const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Page Headers
      content = content.replace(/text-2xl font-bold uppercase tracking-widest glow-cyan-text/g, 'text-3xl font-bold tracking-tight text-foreground');
      
      // Subtitles
      content = content.replace(/text-muted-foreground font-mono/g, 'text-muted-foreground mt-1');
      
      // Card classes
      content = content.replace(/tech-border border-primary\/30 bg-card\/40 backdrop-blur shadow-none/g, 'overflow-hidden');
      content = content.replace(/tech-border border-primary\/20 bg-card\/60 backdrop-blur shadow-sm/g, 'overflow-hidden');
      content = content.replace(/tech-border border-primary\/50/g, 'border-border/50');
      content = content.replace(/tech-border/g, '');
      
      // Card titles
      content = content.replace(/font-mono text-primary flex items-center/g, 'flex items-center text-foreground font-semibold');
      content = content.replace(/font-mono text-primary/g, 'text-foreground font-semibold');
      
      // Remove glow
      content = content.replace(/ hover:glow-cyan-text/g, '');
      content = content.replace(/ hover:glow-cyan/g, '');
      content = content.replace(/ glow-cyan-text/g, '');
      content = content.replace(/ glow-cyan/g, '');
      
      // Font replacements
      content = content.replace(/font-mono text-xs/g, 'text-xs font-medium');
      content = content.replace(/font-mono text-sm/g, 'text-sm');
      content = content.replace(/font-mono text-\[10px\]/g, 'text-[10px] font-medium');
      content = content.replace(/font-mono/g, '');

      // Borders and backgrounds
      content = content.replace(/border-primary\/30 hover:border-primary/g, 'border-border/50 hover:border-primary/50 transition-all');
      content = content.replace(/border-primary\/30/g, 'border-border/50');
      content = content.replace(/divide-primary\/20/g, 'divide-border/50');
      content = content.replace(/border-primary\/20/g, 'border-border/50');
      content = content.replace(/border-primary\/10/g, 'border-border/50');
      
      // Uppercase texts
      content = content.replace(/uppercase tracking-wider text-muted-foreground/g, 'font-medium text-muted-foreground');
      content = content.replace(/uppercase tracking-widest/g, 'tracking-tight');
      
      // Clean arbitrary multiple spaces in class names (rudimentary)
      content = content.replace(/className="\s+/g, 'className="');
      content = content.replace(/\s+"/g, '"');
      content = content.replace(/\s+/g, ' ');

      // Fix any syntax breaks caused by space reduction replacing newlines
      // WAIT! \s+ will replace newlines if not careful!
      // Let's NOT do global \s+ replacement because it destroys JSX formatting.
      // I will only do classname space cleanup.
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

// Quick reload of the script to remove the dangerous \s+ replace
let script = `
const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/text-2xl font-bold uppercase tracking-widest glow-cyan-text/g, 'text-3xl font-bold tracking-tight text-foreground');
      content = content.replace(/text-muted-foreground font-mono/g, 'text-muted-foreground mt-1');
      content = content.replace(/tech-border border-primary\\/30 bg-card\\/40 backdrop-blur shadow-none/g, 'overflow-hidden');
      content = content.replace(/tech-border border-primary\\/20 bg-card\\/60 backdrop-blur shadow-sm/g, 'overflow-hidden');
      content = content.replace(/tech-border border-primary\\/50/g, 'border-border/50');
      content = content.replace(/tech-border/g, '');
      content = content.replace(/font-mono text-primary flex items-center/g, 'flex items-center text-foreground font-semibold');
      content = content.replace(/font-mono text-primary/g, 'text-foreground font-semibold');
      content = content.replace(/ hover:glow-cyan-text/g, '');
      content = content.replace(/ hover:glow-cyan/g, '');
      content = content.replace(/ glow-cyan-text/g, '');
      content = content.replace(/ glow-cyan/g, '');
      content = content.replace(/font-mono text-xs/g, 'text-xs font-medium');
      content = content.replace(/font-mono text-sm/g, 'text-sm');
      content = content.replace(/font-mono text-\\[10px\\]/g, 'text-[10px] font-medium');
      content = content.replace(/ font-mono /g, ' ');
      content = content.replace(/"font-mono /g, '"');
      content = content.replace(/ font-mono"/g, '"');
      content = content.replace(/border-primary\\/30 hover:border-primary/g, 'border-border/50 hover:border-primary/50 transition-all');
      content = content.replace(/border-primary\\/30/g, 'border-border/50');
      content = content.replace(/divide-primary\\/20/g, 'divide-border/50');
      content = content.replace(/border-primary\\/20/g, 'border-border/50');
      content = content.replace(/border-primary\\/10/g, 'border-border/50');
      content = content.replace(/uppercase tracking-wider text-muted-foreground/g, 'font-medium text-muted-foreground');
      content = content.replace(/uppercase tracking-widest/g, 'tracking-tight');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src', 'pages'));
console.log('Done replacing strings in pages');
`;
fs.writeFileSync(path.join(__dirname, 'clean-theme.js'), script);
