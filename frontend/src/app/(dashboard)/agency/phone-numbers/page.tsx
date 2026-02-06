import { TwilioNumberPicker } from '@/components/agency/twilio-number-picker'

export default function PhoneNumbersPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Phone Numbers</h1>
                <p className="text-muted-foreground mt-1">Search and purchase Twilio phone numbers for your restaurants</p>
            </div>

            <TwilioNumberPicker />
        </div>
    )
}
