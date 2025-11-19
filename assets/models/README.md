# 3D Model Instructions

## How to Add a Human Anatomy 3D Model

This folder is where you should place your 3D human anatomy model for the muscle group selection feature.

### Recommended Free Sources:

#### 1. Sketchfab (Easiest)
1. Visit: https://sketchfab.com/search?q=human+muscle+anatomy&type=models
2. Filter by "Downloadable" and "Free"
3. Look for models with separate muscle groups
4. Download in GLB format (preferred) or GLTF
5. Rename the file to `human.glb`
6. Place it in this folder

**Recommended Models:**
- Search for "muscle system", "human anatomy", "muscular system"
- Look for models with 200k-500k triangles (good balance of detail/performance)
- Prefer models with named muscle groups in the hierarchy

#### 2. CGTrader
1. Visit: https://www.cgtrader.com/free-3d-models/anatomy
2. Filter by:
   - Free models only
   - GLB or GLTF format
3. Download and extract
4. Rename to `human.glb`
5. Place it in this folder

#### 3. Free3D
1. Visit: https://free3d.com/3d-models/muscle
2. Download a free human muscle model
3. If it's in OBJ/FBX format, you'll need to convert it to GLB using:
   - Blender (free): Import OBJ → Export GLB
   - Online converter: https://products.aspose.app/3d/conversion/obj-to-glb

### File Requirements:

- **Format**: `.glb` (Binary GLTF) - best for mobile performance
- **Size**: Under 10MB recommended for smooth loading
- **Structure**: Ideally separate mesh objects for each muscle group
- **Naming**: Save as `human.glb` in this folder

### Expected File Structure:

```
assets/
  models/
    human.glb          ← Place your model here
    README.md          ← This file
```

### Mesh Names to Look For:

Good models will have meshes named like:
- chest, pectoralis, pecs
- back, latissimus, lats, trapezius
- biceps, triceps
- quadriceps, hamstrings, glutes
- deltoids, shoulders
- abs, abdominals, rectus_abdominis

### After Adding the Model:

1. Place `human.glb` in this folder
2. Open `src/screens/Model3DTestScreen.js`
3. Find this section (around line 75):
   ```javascript
   {useRealModel ? (
     // When you add a real model, uncomment this
     // <LoadedModel
     //   modelPath={require('../../assets/models/human.glb')}
     //   rotation={rotation}
     //   onMeshClick={handleMeshClick}
     // />
   ```
4. Uncomment the `LoadedModel` component
5. Comment out the `PlaceholderHuman` below it
6. Restart your app with cache cleared:
   ```bash
   npm start -- --clear
   ```

### Troubleshooting:

**Model doesn't load:**
- Make sure file is named exactly `human.glb`
- Check file size (should be < 10MB)
- Verify it's in GLB format (not OBJ, FBX, or other)
- Restart with `npm start -- --clear`

**Model looks weird:**
- Scale might be wrong - adjust the `scale={2}` prop in LoadedModel component
- Try different models from the sources above

**Can't click on muscles:**
- Model might not have separate meshes for each muscle
- Check the mesh names using a 3D viewer like:
  - https://gltf-viewer.donmccurdy.com/
  - Blender

### Testing Without a Model:

The current placeholder (geometric shapes) works for testing the interaction and rotation features. You can develop the muscle selection logic before finding the perfect 3D model.

### Future Enhancements:

Once you have a good model, you can:
1. Map mesh names to muscle groups in `src/data/muscleGroupMapping.js`
2. Add detailed muscle subdivisions (upper/middle/lower chest, etc.)
3. Add animations or color highlighting
4. Implement touch gestures for rotation and zoom

---

**Current Status:** Using placeholder geometric model
**Next Step:** Download a GLB model from Sketchfab or CGTrader and place it here
