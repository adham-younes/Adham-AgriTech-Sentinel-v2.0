/**
 * Tool Definitions for the Sovereign Agent
 * These interfaces define the "Hands" of the system.
 */

// --- 1. Google Earth Engine (GEE) ---

export interface GEEAnalysisRequest {
    /** The geometry to analyze (GeoJSON Polygon) */
    geometry: any;
    /** Start date (ISO String) */
    startDate: string;
    /** End date (ISO String) */
    endDate: string;
    /** The algorithm to run */
    algorithm: 'NDVI' | 'EVI' | 'SAVI' | 'MOISTURE_INDEX' | 'YIELD_PREDICTION';
    /** Cloud cover tolerance (0-100) */
    cloudTolerance?: number;
}

export interface GEEAnalysisResponse {
    /** URL to the generated map tile or GeoTIFF */
    assetUrl: string;
    /** Statistical mean of the index */
    mean: number;
    /** Standard deviation */
    stdDev: number;
    /** Time series data points */
    timeSeries: Array<{ date: string; value: number }>;
}

// --- 2. BigQuery Analytics ---

export interface BigQueryQuery {
    /** The SQL query to execute. MUST be optimized for BigQuery (partitioning/clustering). */
    query: string;
    /** Parameters for the query to prevent injection */
    params?: Record<string, any>;
}

export interface BigQueryResponse {
    rows: any[];
    totalBytesProcessed: number;
    cacheHit: boolean;
}

// --- 3. Self-Evolution (Code Mod) ---

export interface CodeModification {
    /** The file path to modify */
    filePath: string;
    /** The specific function or class to target */
    targetSymbol: string;
    /** The new code implementation */
    newImplementation: string;
    /** Reasoning for the change (Why is this better?) */
    reasoning: string;
    /** Test case to verify the fix */
    verificationTest: string;
}

export interface DeploymentRequest {
    /** Description of the changes */
    message: string;
    /** Whether to run full test suite before deploy */
    runTests: boolean;
}
