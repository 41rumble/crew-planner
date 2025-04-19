<template>
  <v-file-input
    accept=".csv,.xlsx"
    label="Upload File"
    variant="outlined"
    density="compact"
    hide-details
    class="d-inline-block"
    style="max-width: 200px;"
    @update:model-value="handleFileChange"
  ></v-file-input>
</template>

<script>
export default {
  name: 'FileUploader',
  methods: {
    handleFileChange(file) {
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const fileContent = e.target.result;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        this.$emit('file-loaded', {
          content: fileContent,
          extension: fileExtension,
          name: file.name
        });
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      }
    }
  }
}
</script>