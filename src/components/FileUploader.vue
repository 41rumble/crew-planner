<template>
  <div class="file-uploader">
    <label for="csv-upload" class="action-button upload-button">
      <span class="icon">📂</span> Import CSV
    </label>
    <input 
      type="file" 
      id="csv-upload" 
      accept=".csv" 
      @change="handleFileUpload" 
      class="file-input"
    >
  </div>
</template>

<script>
export default {
  name: 'FileUploader',
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target.result;
        this.$emit('file-loaded', csvContent);
        
        // Reset the file input so the same file can be selected again
        event.target.value = '';
      };
      reader.readAsText(file);
    }
  }
}
</script>

<style scoped>
.file-uploader {
  display: inline-block;
}

.upload-button {
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
}

.upload-button:hover {
  background-color: #45a049;
}

.icon {
  margin-right: 8px;
}

.file-input {
  display: none;
}
</style>