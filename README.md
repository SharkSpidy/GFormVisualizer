# Form Intelligence Dashboard

An AI-powered web application that automatically analyzes and visualizes responses from ANY Google Form or CSV dataset without requiring manual configuration.

## Features

### Intelligence Engine

- **Automatic Question Classification**: Detects question types including scale, Likert, matrix, multiple choice, checkbox, and text responses
- **Before/After Pattern Detection**: Automatically identifies and pairs "before" and "after" questions
- **Dynamic Insight Generation**: Computes average scores, improvements, and identifies top/low performing areas
- **Text Analysis**: Extracts keywords, removes stopwords, counts frequency, and performs sentiment analysis
- **Auto Dashboard Generation**: Renders sections dynamically based on detected data patterns

### Visualizations

- **Improvement Charts**: Before vs After comparisons with grouped bar charts
- **Score Rankings**: Horizontal bar charts showing top-performing areas
- **Distribution Charts**: Pie charts for multiple choice and checkbox responses
- **Keyword Analysis**: Bar charts showing word frequency from text responses
- **Smart Insights Cards**: Highlight key metrics and changes

### Data Import

- **CSV Upload**: Drag-and-drop or click to upload CSV files
- **Google Sheets Integration**: Paste a shareable link to import data directly
- **Automatic Validation**: Validates data structure and provides helpful error messages

### Features

- **Dark Mode**: Modern, eye-friendly dark interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Persistence**: All datasets saved to Supabase for future access
- **Export Reports**: Generate and download text-based analysis reports
- **Multi-Dataset Management**: Switch between multiple datasets via sidebar
- **Real-Time Processing**: See analysis results immediately after upload

## How It Works

1. **Upload Data**: Upload a CSV file or connect a Google Sheet
2. **Automatic Analysis**: The intelligence engine classifies questions, detects patterns, and generates insights
3. **View Dashboard**: Explore interactive visualizations and insights
4. **Export Results**: Download a comprehensive text report of the analysis

## Supported Question Types

- **Scale Questions**: Numeric ratings (1-5, 1-10, etc.)
- **Likert Scale**: Strongly Agree → Strongly Disagree
- **Multiple Choice**: Single selection from options
- **Checkbox**: Multiple selections
- **Text Responses**: Open-ended text with keyword extraction
- **Before/After**: Automatically paired comparison questions

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Data Processing**: PapaParse (CSV parsing)
- **Icons**: Lucide React

## Key Capabilities

### No Hardcoded Questions

The system is fully dynamic and works with any dataset that follows common patterns. No manual configuration needed.

### Intelligent Pattern Recognition

- Detects "before" and "after" keywords in questions
- Normalizes question text to find matching pairs
- Converts Likert scales to numeric values automatically

### Comprehensive Text Analysis

- Removes common stopwords
- Extracts meaningful keywords
- Calculates sentiment (positive/negative/neutral)
- Groups responses by sentiment category

### Adaptive Visualizations

The dashboard automatically selects the best visualization type for each question based on:
- Data type (numeric, text, categorical)
- Response patterns
- Question relationships

## Data Privacy

- All data is stored securely in Supabase
- Row Level Security (RLS) ensures users only see their own data
- No data is shared or transmitted to third parties
- Anonymous authentication for quick testing

## Getting Started

1. Upload a CSV file or connect a Google Sheet
2. Wait for automatic analysis (typically 1-3 seconds)
3. Explore the generated insights and visualizations
4. Export a report or upload additional datasets

## Example Use Cases

- Survey analysis (employee satisfaction, customer feedback)
- Training program evaluation (before/after assessments)
- Event feedback analysis
- Research data exploration
- Form response visualization
