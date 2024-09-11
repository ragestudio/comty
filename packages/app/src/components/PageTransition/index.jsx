import React from "react"
import { motion, AnimatePresence } from "framer-motion"

const PageTransition = (props) => {
    return <AnimatePresence>
        <motion.div
            layout
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {props.children}
        </motion.div>
    </AnimatePresence>
}

export default PageTransition