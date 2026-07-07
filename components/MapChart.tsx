import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { smartFormat } from '../utils/formatters';

// Recommended topojson for react-simple-maps containing country names
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_ALIASES: Record<string, string[]> = {
    "united states of america": ["usa", "us", "united states", "u.s.a.", "u.s."],
    "united kingdom": ["uk", "u.k.", "great britain", "britain"],
    "united arab emirates": ["uae", "u.a.e."],
    "south korea": ["korea", "republic of korea"],
    "north korea": ["dprk", "democratic people's republic of korea"],
    "russia": ["russian federation"],
};

const parseNumeric = (val: any): number | null => {
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (!val && val !== 0) return null;
    const cleaned = String(val).replace(/[^0-9.-]+/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
};

interface MapChartProps {
    data: any[];
    countryKey: string;
    dataKey: string;
    baseColor?: string;
    fontSettings?: any;
    theme?: string;
}

export const MapChart: React.FC<MapChartProps> = ({
    data,
    countryKey,
    dataKey,
    baseColor = '#6366f1',
    fontSettings,
    theme = 'light'
}) => {
    const [tooltipContent, setTooltipContent] = useState<{ title: string, value?: string } | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const findDataForCountry = (geo: any) => {
        const geoName = geo.properties.name?.toLowerCase() || "";
        const iso2 = geo.properties.iso_a2?.toLowerCase() || "";
        const iso3 = geo.properties.iso_a3?.toLowerCase() || "";
        const aliases = COUNTRY_ALIASES[geoName] || [];

        return data.find(d => {
            const val = String(d[countryKey] || "").toLowerCase().trim();
            return val === geoName || val === iso2 || val === iso3 || aliases.includes(val);
        });
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ fontFamily: fontSettings?.fontFamily }}>
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 130 }} width={800} height={400} style={{ width: "100%", height: "100%" }}>
                <ZoomableGroup center={[0, 20]} zoom={1} maxZoom={5}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const d = findDataForCountry(geo);
                                const val = d ? parseNumeric(d[dataKey]) : null;
                                const fill = val !== null ? baseColor : (theme === 'dark' ? '#1e293b' : '#e2e8f0');
                                
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fill}
                                        stroke={theme === 'dark' ? '#0f172a' : '#ffffff'}
                                        strokeWidth={0.5}
                                        onMouseEnter={(e) => {
                                            const { clientX, clientY } = e as unknown as React.MouseEvent;
                                            setTooltipPos({ x: clientX, y: clientY });
                                            if (d && val !== null) {
                                                setTooltipContent({ title: geo.properties.name, value: smartFormat(val, dataKey) });
                                            } else {
                                                setTooltipContent({ title: geo.properties.name });
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            const { clientX, clientY } = e as unknown as React.MouseEvent;
                                            setTooltipPos({ x: clientX, y: clientY });
                                        }}
                                        onMouseLeave={() => {
                                            setTooltipContent(null);
                                        }}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: val !== null ? baseColor : (theme === 'dark' ? '#475569' : '#cbd5e1'), outline: "none", cursor: "pointer", transition: "all 250ms", opacity: 0.8 },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {tooltipContent && createPortal(
                <div
                    className={`fixed z-[9999] px-3 py-2 rounded-xl shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+12px)] border backdrop-blur-md transition-all duration-150 ${
                        theme === 'dark' 
                            ? 'bg-slate-900/90 border-slate-700/50 text-white' 
                            : 'bg-white/95 border-slate-200/60 text-slate-900'
                    }`}
                    style={{ top: tooltipPos.y, left: tooltipPos.x }}
                >
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: baseColor }}></div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{tooltipContent.title}</div>
                    </div>
                    {tooltipContent.value && (
                        <div className="text-lg font-black tracking-tight leading-none" style={{ color: baseColor }}>
                            {tooltipContent.value}
                        </div>
                    )}
                    
                    {/* Bottom arrow pointer */}
                    <div 
                        className={`absolute bottom-[-5px] left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-b border-r ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200/60'
                        }`}
                    ></div>
                </div>,
                document.body
            )}
        </div>
    );
};
