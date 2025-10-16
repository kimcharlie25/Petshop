# Site Settings - Menu Description Integration

## Overview
The site description from the admin panel's Site Settings is now dynamically displayed below the "Our Menu" heading on the customer-facing menu page.

## Implementation Details

### Changes Made

#### 1. Menu Component (`src/components/Menu.tsx`)
- **Imported** `useSiteSettings` hook to access site settings data
- **Added** dynamic description rendering with loading state
- **Replaced** hardcoded description text with `siteSettings.site_description`

### How It Works

1. **Admin Configuration**
   - Admin navigates to **Dashboard → Site Settings**
   - Updates the **Site Description** field with custom text
   - Saves the changes

2. **Customer Display**
   - When customers view the menu, the description is fetched from the database
   - Shows a loading skeleton while fetching
   - Displays the custom description below "Our Menu" heading
   - Falls back to a default message if no description is set

### Code Structure

```tsx
// Import the hook
import { useSiteSettings } from '../hooks/useSiteSettings';

// Inside component
const { siteSettings, loading: settingsLoading } = useSiteSettings();

// In the render
{settingsLoading ? (
  <div className="animate-pulse h-4 bg-gray-200 rounded w-96 max-w-2xl"></div>
) : (
  <p className="text-gray-600 max-w-2xl mx-auto">
    {siteSettings?.site_description || 'Default fallback text...'}
  </p>
)}
```

## Features

✅ **Dynamic Content** - Description updates automatically when admin changes it  
✅ **Loading State** - Shows skeleton loader while fetching  
✅ **Fallback Text** - Displays default message if no description is set  
✅ **Responsive** - Works on all screen sizes  
✅ **Real-time** - Changes reflect immediately (no cache)

## Database Schema

The description is stored in the `site_settings` table:
- **Table**: `site_settings`
- **Field ID**: `site_description`
- **Type**: Text
- **Default**: Empty string

## Testing

To test this feature:

1. **Update Description**
   - Go to Admin Dashboard
   - Navigate to Site Settings
   - Edit the "Site Description" field
   - Save changes

2. **Verify Display**
   - Return to customer menu page
   - Check that the description appears below "Our Menu"
   - Verify it matches what you entered in settings

3. **Test Empty State**
   - Clear the description in Site Settings
   - Verify the fallback text appears

## Benefits

- **Content Control**: Admin has full control over menu description without code changes
- **Consistency**: Same description system used across the app
- **User Experience**: Smooth loading transitions
- **Maintainability**: No hardcoded content in components

## Related Files

- `src/components/Menu.tsx` - Menu display component
- `src/components/SiteSettingsManager.tsx` - Admin settings interface
- `src/hooks/useSiteSettings.ts` - Site settings hook
- `src/types/index.ts` - TypeScript interfaces

