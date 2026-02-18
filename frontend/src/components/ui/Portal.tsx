import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children, targetId }: { children: React.ReactNode; targetId?: string }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const target = targetId ? document.getElementById(targetId) : document.body;
    return target ? createPortal(children, target) : null;
};

export default Portal;
