import { CategoriesPage } from '@/component/Categoriespage';
import { WorkOrderSidebar } from '@/component/Sidebar';


const page = () => {
 
   return (
     <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
       <WorkOrderSidebar />
       <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
         <CategoriesPage />
       </main>
       
     </div>
   );
}

export default page
