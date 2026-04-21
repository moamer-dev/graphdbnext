import { FolderSearch } from 'lucide-react'
import Image from 'next/image'

interface FileIconProps {
  type: string
  className?: string
}

export const FileIcon = ({ type, className }: FileIconProps) => {
    const isXml = type.toUpperCase() === 'XML'
    const isJson = type.toUpperCase() === 'JSON'
    
    if (isXml) {
        return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <Image 
                    src="/icons/xml.svg" 
                    alt="XML" 
                    width={16} 
                    height={16} 
                />
            </div>
        )
    }
    
    if (isJson) {
        return (
            <div className={`relative flex items-center justify-center ${className}`}>
                <Image 
                    src="/icons/json.svg" 
                    alt="JSON" 
                    width={16} 
                    height={16} 
                />
            </div>
        )
    }
    
    return <FolderSearch className={className} />
}
