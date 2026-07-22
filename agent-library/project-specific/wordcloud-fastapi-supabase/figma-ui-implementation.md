# Skill - Figma UI Implementation

## When To Use

Use this skill when Figma is connected and screens, layouts, components, or styles need to be implemented.

## Goal

Implement the Next.js UI based on the Figma design.

## Before Starting

1. Check the full Figma page list.
2. Check the current code route structure.
3. Map Figma screens to real routes.
4. Extract common component candidates.
5. Confirm mobile and desktop responsive expectations.

## Required Product UI Language

- The implemented product UI MUST use Korean copy for end users.
- Do not convert UI labels, buttons, validation messages, empty states, or help text to English unless the user explicitly asks for an English UI.
- Developer-facing docs may be English, but the visible app experience is Korean.

## Main Pages To Implement

- Landing page
- Login page
- Signup page
- Pricing page
- Payment success page
- Dashboard home
- New wordcloud extraction search page
- Analysis progress / result page
- Wordcloud history list page
- Saved wordcloud detail page
- Place / blog usage guide page
- My page

## Common Component Candidates

- Button
- Card
- Input
- Sidebar
- Header
- PriceCard
- StatusBadge
- WordCloudPanel
- BarChartPanel
- HistoryList
- ProgressSteps
- SourceLinkList
- TokenBalanceCard

## UI Implementation Principles

- Prioritize the Figma layout, colors, spacing, font sizes, and card styles.
- Do not over-redesign the design system.
- Use shadcn/ui and Tailwind CSS.
- Implement mobile first.
- Make the sidebar feel natural on desktop.
- Complete missing screens in the same design tone.

## Required Analysis UI Elements

New extraction screen:

- Search keyword input
- Example keywords
- Start analysis button
- Current token or plan state
- Analysis progress state
- Error message

Result screen:

- Search keyword
- Creation date and time
- Referenced blog count
- Successfully collected blog count
- Failed blog count
- Word cloud
- Bar chart
- Word frequency table
- Referenced blog link list
- Re-analyze button
- Back to history button

## Suggested UX Copy Themes

- Explain that the app analyzes frequently used words from the top 20 blogs.
- Help users check competitor content wording before writing a blog post.
- Emphasize visual keyword discovery for Place marketing.
- Explain that frequent words are visible through a wordcloud and bar chart.
- Explain that analysis results are saved based on the creation time.
- Write the actual visible UI copy in natural Korean during implementation.

