<template>
  <v-btn
    color="primary"
    prepend-icon="mdi-upload"
    size="small"
    density="compact"
    class="mr-2"
    @click="$refs.fileInput.click()"
  >
    Upload
  </v-btn>
  <input 
    type="file" 
    ref="fileInput"
    accept=".csv,.xlsx,.json" 
    @change="handleFileUpload" 
    style="display: none;"
  >
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
        const fileContent = e.target.result;
        this.$emit('file-loaded', fileContent);
        
        // Reset the file input so the same file can be selected again
        event.target.value = '';
      };
      reader.readAsText(file);
    }
  }
}
</script>