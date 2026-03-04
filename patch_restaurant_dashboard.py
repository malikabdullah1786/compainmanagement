import re

filepath = r"e:\sms\frontend\src\app\(dashboard)\restaurant\dashboard\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { useCampaigns, useCustomers, useRestaurantStats, Campaign } from '@/lib/queries'",
    "import { useCampaigns, useCustomers, useRestaurantStats, useRestaurant, Campaign } from '@/lib/queries'\nimport { GetPhoneNumberCard } from './components/get-phone-number-card'"
)

# 2. Add restaurant query inside component
query_logic = """    // Fetch real data from API
    const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(restaurantId!)
    const { data: customers = [], isLoading: customersLoading } = useCustomers(restaurantId)"""

content = content.replace(
    "    // Fetch real data from API\n    const { data: customers = [], isLoading: customersLoading } = useCustomers(restaurantId)",
    query_logic
)

isLoading_logic = """    const isLoading = authLoading || customersLoading || campaignsLoading || restaurantLoading"""
content = content.replace(
    "    const isLoading = authLoading || customersLoading || campaignsLoading",
    isLoading_logic
)

# 3. Add conditionally rendered warning banner
ui_banner = """            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Welcome back, {profile?.business_name || 'Restaurant'}
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your SMS campaigns</p>
                </div>
                <Link href="/restaurant/campaigns/new">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* Check for Phone Number Setup */}
            {restaurant && !restaurant.twilio_phone_number && (
                <GetPhoneNumberCard restaurantId={restaurantId!} budget={restaurant.budget_monthly_gbp} spend={restaurant.current_spend_gbp} />
            )}"""

content = content.replace(
    "            {/* Header */}\n            <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4\">\n                <div>\n                    <h1 className=\"text-2xl font-bold text-foreground\">\n                        Welcome back, {profile?.business_name || 'Restaurant'}\n                    </h1>\n                    <p className=\"text-muted-foreground mt-1\">Here's what's happening with your SMS campaigns</p>\n                </div>\n                <Link href=\"/restaurant/campaigns/new\">\n                    <Button className=\"bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700\">\n                        <Plus className=\"mr-2 h-4 w-4\" />\n                        New Campaign\n                    </Button>\n                </Link>\n            </div>",
    ui_banner
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully injected self-serve number box into Restaurant Dashboard.")
