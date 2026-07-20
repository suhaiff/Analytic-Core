import React, { useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { 
    BarChart3, AlignLeft, LineChart, Activity, PieChart, 
    Hash, BarChart2, Layers, ScatterChart, Droplet, 
    Grid, Table, Grid3x3, TrendingUp, Map 
} from 'lucide-react';

const chartTypes = [
    { name: "Bar Chart", icon: BarChart3 },
    { name: "Horizontal Bar", icon: AlignLeft },
    { name: "Line Chart", icon: LineChart },
    { name: "Area Chart", icon: Activity },
    { name: "Pie Chart", icon: PieChart },
    { name: "KPI Card", icon: Hash },
    { name: "Grouped Bar", icon: BarChart2 },
    { name: "Stacked Bar", icon: Layers },
    { name: "Combo Chart", icon: Activity },
    { name: "Scatter Plot", icon: ScatterChart },
    { name: "Waterfall", icon: Droplet },
    { name: "Heatmap", icon: Grid },
    { name: "Table", icon: Table },
    { name: "Matrix", icon: Grid3x3 },
    { name: "Forecasting", icon: TrendingUp },
    { name: "Map Chart", icon: Map }
];

export const ChartMarquee: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Duplicate the array to create a seamless loop
    const duplicatedCharts = [...chartTypes, ...chartTypes];

    const direction = -1; // right-to-left
    const baseSpeed = 0.3; // reduced speed
    
    const baseX = useMotionValue(0);
    const velocity = useSpring(direction * baseSpeed, { damping: 50, stiffness: 400 });

    useAnimationFrame((t, delta) => {
        let v = velocity.get();
        let move = v * (delta / 1000) * 1.5; // adjust speed multiplier
        let newX = baseX.get() + move;
        
        if (newX <= -50) {
            newX += 50;
        }
        
        baseX.set(newX);
    });

    const x = useTransform(baseX, (v) => `${v}%`);

    return (
        <div 
            className="w-full overflow-hidden py-10 z-20"
            style={{ 
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', 
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' 
            }}
            onMouseEnter={() => velocity.set(0)}
            onMouseLeave={() => velocity.set(direction * baseSpeed)}
        >
            <motion.div style={{ x }} className="flex gap-8 sm:gap-12 w-max">
                {duplicatedCharts.map((chart, index) => {
                    const Icon = chart.icon;
                    
                    return (
                        <div 
                            key={index}
                            className={`
                                flex flex-col items-center justify-center min-w-[140px] sm:min-w-[180px] h-24 sm:h-28 rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer
                                ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'}
                            `}
                        >
                            <Icon 
                                className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} 
                                strokeWidth={1.5}
                            />
                            <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {chart.name}
                            </span>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};
