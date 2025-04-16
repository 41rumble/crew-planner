/**
 * Timeline drag handlers for the crew planning tool
 * These methods handle the drag functionality for adjusting department start and end months
 */

export const timelineDragHandlers = {
  /**
   * Handle mouse down on a cell to start dragging
   * @param {Event} event - The mouse event
   * @param {number} departmentIndex - The index of the department
   * @param {number} monthIndex - The index of the month
   */
  handleCellMouseDown(event, departmentIndex, monthIndex) {
    // Check if we're clicking on a drag handle
    const target = event.target;
    if (target.classList.contains('start-drag-handle')) {
      this.isDraggingTimelineHandle = true;
      this.draggedDepartmentIndex = departmentIndex;
      this.dragHandleType = 'start';
      
      // Add event listeners for drag
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      
      // Prevent default to avoid text selection
      event.preventDefault();
    } else if (target.classList.contains('end-drag-handle')) {
      this.isDraggingTimelineHandle = true;
      this.draggedDepartmentIndex = departmentIndex;
      this.dragHandleType = 'end';
      
      // Add event listeners for drag
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      
      // Prevent default to avoid text selection
      event.preventDefault();
    }
  },
  
  /**
   * Handle mouse move during drag
   * @param {Event} event - The mouse event
   */
  handleMouseMove(event) {
    if (!this.isDraggingTimelineHandle) return;
    
    // Get the table element
    const table = document.querySelector('.crew-table');
    if (!table) return;
    
    // Get the cell under the mouse
    const cellUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    if (!cellUnderMouse) return;
    
    // Find the closest td element
    let tdElement = cellUnderMouse.closest('td');
    if (!tdElement) return;
    
    // Skip if it's a fixed column or not a department cell
    if (tdElement.classList.contains('fixed-column') || !tdElement.classList.contains('dept-cell')) return;
    
    // Find the month index from the cell
    const monthIndex = Array.from(tdElement.parentElement.children).indexOf(tdElement) - 1; // -1 to account for the fixed column
    if (monthIndex < 0 || monthIndex >= this.months.length) return;
    
    // Update the department's start or end month
    const department = this.departments[this.draggedDepartmentIndex];
    
    if (this.dragHandleType === 'start') {
      // Don't allow start month to go beyond end month
      if (monthIndex <= department.endMonth) {
        department.startMonth = monthIndex;
        this.updateDepartmentTimeframe(department);
      }
    } else if (this.dragHandleType === 'end') {
      // Don't allow end month to go before start month
      if (monthIndex >= department.startMonth) {
        department.endMonth = monthIndex;
        this.updateDepartmentTimeframe(department);
      }
    }
  },
  
  /**
   * Handle mouse up to end dragging
   */
  handleMouseUp() {
    if (this.isDraggingTimelineHandle) {
      this.isDraggingTimelineHandle = false;
      this.draggedDepartmentIndex = null;
      this.dragHandleType = null;
      
      // Remove event listeners
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
  }
};