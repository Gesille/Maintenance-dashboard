import { CategoriesPage } from '@/component/Categoriespage';
import { WorkOrderSidebar } from '@/component/Sidebar';


const page = () => {
 
   return (
     <div style={{ height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
       <WorkOrderSidebar />
    
         <CategoriesPage />
       
       
     </div>
   );
}

export default page
