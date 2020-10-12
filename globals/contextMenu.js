import * as Icons from 'components/Icons'

export default [
 {
   key: "inspect_element",
   title: "Inspect",
   icon: <Icons.Command />,
   require: "embedded",
   params: {
     onClick: (e) => {
       window.inspectElement(e)
     }
   }
 }
]