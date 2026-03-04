import re

filepath = r"e:\sms\frontend\src\app\(dashboard)\agency\restaurants\[restaurantId]\edit\page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { useRestaurant } from '@/lib/queries'",
    "import { useRestaurant, useAgency, useAgencyRestaurants } from '@/lib/queries'"
)

# 2. Add queries and budget logic
budget_logic = """    const { data: restaurant, isLoading } = useRestaurant(restaurantId)
    const { data: agency } = useAgency(restaurant?.agency_id || '')
    const { data: allAgencyRestaurants } = useAgencyRestaurants(restaurant?.agency_id || '')

    const agencyTotalBudget = agency?.budget_monthly_gbp || 0
    const otherRestaurantsAllocated = (allAgencyRestaurants || [])
         .filter((r: any) => r.id !== restaurantId)
         .reduce((sum: number, r: any) => sum + (r.budget_monthly_gbp || 0), 0)
    const maxAvailableBudget = agencyTotalBudget - otherRestaurantsAllocated"""

content = content.replace(
    "    const { data: restaurant, isLoading } = useRestaurant(restaurantId)",
    budget_logic
)

# 3. Add watch and isBudgetExceeded
watch_logic = """    const timezone = watch('timezone')
    const status = watch('status')
    const currentBudgetInput = watch('budget_monthly_gbp') || '0'
    const isBudgetExceeded = agencyTotalBudget > 0 && parseFloat(currentBudgetInput) > maxAvailableBudget"""

content = content.replace(
    "    const timezone = watch('timezone')\n    const status = watch('status')",
    watch_logic
)

# 4. Update the input UI
input_ui_original = """                        <div className="space-y-2 pt-2">
                            <Label htmlFor="spending_limit">Monthly Budget (€)</Label>
                            <Input
                                id="spending_limit"
                                type="number"
                                placeholder="e.g., 500"
                                {...register('budget_monthly_gbp')}
                            />
                        </div>"""

input_ui_new = """                        <div className="space-y-2 pt-2">
                            <Label htmlFor="spending_limit">Monthly Budget (£)</Label>
                            <Input
                                id="spending_limit"
                                type="number"
                                placeholder="e.g., 500"
                                {...register('budget_monthly_gbp')}
                                className={isBudgetExceeded ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {agencyTotalBudget > 0 && (
                                <p className={`text-sm ${isBudgetExceeded ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                    Available Agency Budget to Allocate: £{Math.max(0, maxAvailableBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}
                                </p>
                            )}
                        </div>"""

content = content.replace(input_ui_original, input_ui_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully injected budget indicator via Python patch.")
