import { Command } from 'components/Icons'
export default [
 {
   key: "inspect_element",
   title: "Inspect",
   icon: <Command />,
   require: "embedded",
   params: {
     onClick: (e) => {
       window.inspectElement(e)
     }
   }
 }
]