import React from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { FileText, FileJson, FileCode } from 'lucide-react';
import excelIcon from './images/excel_icon.png';
import xmlIcon from './images/xml_icon.png';
import jsonIcon from './images/json_icon.png';
import mysqlIcon from './images/mysql_icon.png';
import gsheetIcon from './images/gsheet_icon.png';
import sharepointIcon from './images/sharepoint_icon.png';
import azureBlobIcon from './images/azure_blob.png';
import awsS3Icon from './images/awss3_icon.png';
import postgresIcon from './images/postgres_icon.png';
import cloudIcon from './images/cloud_icon.png';
import bigQueryIcon from './images/bigquery_icon.png';
import snowflakeIcon from './images/snowflake_icon.png';
import redshiftIcon from './images/amazonredshift_icon.png';
import azureSqlIcon from './images/azuresql_icon.png';
import dataBricksIcon from './images/databricks_icon.png';
import atlasIcon from './images/mongodbatlas_icon.png';


const integrationTypes = [
    { name: "CSV", icon: FileText, color: "#10B981" },
    { name: "Excel", img: excelIcon },
    { name: "XML", img: xmlIcon },
    { name: "JSON", img: jsonIcon },
    { name: "Google Sheets", img: gsheetIcon },
    { name: "SharePoint", img: sharepointIcon },
    { name: "MySQL", img: mysqlIcon },
    { name: "PostgreSQL", img: postgresIcon },
    { name: "AWS S3", img: awsS3Icon },
    { name: "Azure Blob Storage", img: azureBlobIcon },
    { name: "Google Cloud", img: cloudIcon },
    { name: "BigQuery", img: bigQueryIcon },
    { name: "Snowflake", img: snowflakeIcon },
    { name: "Amazon Redshift", img: redshiftIcon },
    { name: "Azure SQL", img: azureSqlIcon },
    { name: "Databricks", img: dataBricksIcon },
    { name: "MongoDB Atlas", img: atlasIcon }
];

export const IntegrationMarquee: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Duplicate the array to create a seamless loop
    const duplicatedIntegrations = [...integrationTypes, ...integrationTypes];

    const direction = 1; // left-to-right
    const baseSpeed = 0.3; 
    
    const baseX = useMotionValue(-50);
    const velocity = useSpring(direction * baseSpeed, { damping: 50, stiffness: 400 });

    useAnimationFrame((t, delta) => {
        let v = velocity.get();
        let move = v * (delta / 1000) * 1.5; 
        let newX = baseX.get() + move;
        
        if (newX >= 0) {
            newX -= 50;
        }
        
        baseX.set(newX);
    });

    const x = useTransform(baseX, (v) => `${v}%`);

    return (
        <div 
            className="w-full overflow-hidden py-10 z-20 mt-20 mb-20 sm:mb-32"
            style={{ 
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', 
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' 
            }}
            onMouseEnter={() => velocity.set(0)}
            onMouseLeave={() => velocity.set(direction * baseSpeed)}
        >
            <motion.div style={{ x }} className="flex gap-8 sm:gap-12 w-max">
                {duplicatedIntegrations.map((integration, index) => {
                    return (
                        <div 
                            key={index}
                            className={`
                                flex flex-col items-center justify-center min-w-[140px] sm:min-w-[180px] h-24 sm:h-28 rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer
                                ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'}
                            `}
                        >
                            {integration.img ? (
                                <img 
                                    src={integration.img} 
                                    alt={integration.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 object-contain drop-shadow-sm" 
                                />
                            ) : integration.icon ? (
                                <integration.icon 
                                    className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3" 
                                    style={{ color: integration.color }}
                                    strokeWidth={1.5}
                                />
                            ) : null}
                            <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {integration.name}
                            </span>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};
