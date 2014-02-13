mjs-volume
==========

For the time being, `mjs-volume` provides only one [MontageJS](http://www.montagejs.org) Component: `SceneView`.  
A `SceneView` is a WebGL accelerated `Component` supporting the following features:  

* Display a `Scene` in [glTF](https://github.com/KhronosGroup/glTF) format.
* Assign view points.
* Play/Pause/Stop animations from its associated `Scene`.
* And more...


In addition to `SceneView` another kind of Components, the 3D Components are provided by `mjs-volume`.
These 3D Components extend `Component3D` such as `Node` and `Material`
> in upcoming versions of this package, more runtime 3D Components from `mjs-volume` will be exposed.
> Also, at the moment, only their access through serialization is exposed.

A `Component3D` behaves like MontageJS `Component`:
* it can be declared in the serialization.
* via `classList` property, it applies CSS Styles, as demoed in this [blog](http://montagejs.org/blog/2014/01/22/build-3d-applications-with-montagejs/)

## Importing models

A `SceneView` is associated with a `Scene` which takes a glTF asset for input.  
To produce glTF Assets, 3D File are are converterted using such [tool](https://github.com/KhronosGroup/glTF/wiki/Converter-builds).

### Converting 3D Files

Our command line tool to convert a scene is collada2gltf.  
It converts a COLLADA file to a glTF asset.

```
collada2gltf -f duck.dae
```

It will create `duck.json`, which companions files (binary data and shaders).  

As they become available, other converters producing compliant glTF may be used.  
They could take any other format than COLLADA as input.  

Once this asset is ready, a `Scene` can be created and assigned to a view...

### Displaying a 3D Scene

The following steps must following to import a scene:
1. Create a `Scene`.
2. Assign it to a `SceneView`.

#### Create a Scene

In the MontageJS [declaration](http://montagejs.org/docs/serialization-format.html), we expose a `Scene` and set its path to the glTF asset:  

```
"duckScene": {
 	"prototype": "mjs-volume/runtime/scene",
  	"properties": {
  		"path": "duck.json"
  	}
},
```

#### Assigning a Scene

To assign a Scene to a SceneView we simply to reference within the declaration

```
"sceneView": {
	"prototype": "mjs-volume/ui/scene-view.reel",
	"properties": {
		"element": { "#": "sceneView" },
		"scene": { "@": "duckScene" },
		}
	}
}
```

## Supported CSS Features

While we want to clearly extends the CSS Support, we also want to keep to what's essential.  
So, this short list will grow with time *but* the whole set of CSS specs can't be expected to be implemented (and even make sense) here.

Here what is currently commonly supported:
* **Transitions**:
 * **timingFunction**: `ease`, `linear`, `ease-in`, `ease-out` `ease-in-out`

Properties supported by Node:
* **tranform**: `rotateX`, `rotateY`, `rotateZ`, `rotate3d`, `scaleX`, `scaleY`, `scaleZ`, `translateX`, `translateY`, `translateZ`
* **transform-origin**
* **visibility**: `hidden`, `visible`
* **-montage-transform-z-origin** (to extend transform origin 3d content with depth)

Properties supported by Material:
> will soon add ability to set images/color here.  

* **opacity**  

## API

### Scene

### SceneView

#### scene

#### viewPoint:

#### play:

#### pause:

#### stop:

#### automaticallyCyclesThroughViewPoints

#### allowsProgressiveSceneLoading

#### allowsViewPointControl

### Node

### Material
