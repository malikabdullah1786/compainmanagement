import re

filepath = r"e:\sms\frontend\src\app\admin\dashboard\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the giant header block
pattern = re.compile(r'<div className="min-h-screen bg-background">\s*\{\/\* Header \*\/\}\s*<header.*?</header>\s*<main className="max-w-6xl mx-auto p-6 space-y-6">', re.DOTALL)

replacement = """<div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">User Approvals</h2>
                    <p className="text-muted-foreground">Manage and verify new signups.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            <div className="space-y-6">"""

new_content = re.sub(pattern, replacement, content)

# Replace the closing </main>
new_content = new_content.replace('</main>', '</div>')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully patched the dashboard page.")
